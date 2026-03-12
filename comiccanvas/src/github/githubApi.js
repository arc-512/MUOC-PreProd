const BASE = 'https://api.github.com'

// ── Helpers ───────────────────────────────────────────
const headers = (pat) => ({
    'Authorization': `Bearer ${pat}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github+json',
})

const b64Encode = (str) => btoa(unescape(encodeURIComponent(str)))
const b64Decode = (str) => decodeURIComponent(escape(atob(str)))

// ── Get file (returns null if not found) ──────────────
export async function getFile(pat, repo, branch, path) {
    const res = await fetch(
        `${BASE}/repos/${repo}/contents/${path}?ref=${branch}`,
        { headers: headers(pat) }
    )
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`GitHub error ${res.status}: ${res.statusText}`)
    const data = await res.json()
    return {
        content: b64Decode(data.content.replace(/\n/g, '')),
        sha: data.sha,
    }
}

// ── Write file ────────────────────────────────────────
export async function writeFile(pat, repo, branch, path, content, sha = null) {
    const body = {
        message: `ComicCanvas: update ${path}`,
        content: b64Encode(content),
        branch,
    }
    if (sha) body.sha = sha

    const res = await fetch(
        `${BASE}/repos/${repo}/contents/${path}`,
        {
            method: 'PUT',
            headers: headers(pat),
            body: JSON.stringify(body),
        }
    )
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || `GitHub write error ${res.status}`)
    }
    return await res.json()
}

// ── Ensure branch exists ──────────────────────────────
export async function ensureBranch(pat, repo, branch) {
    // Check if branch exists
    const res = await fetch(
        `${BASE}/repos/${repo}/branches/${branch}`,
        { headers: headers(pat) }
    )
    if (res.ok) return // branch exists

    // Get default branch SHA to branch from
    const repoRes = await fetch(
        `${BASE}/repos/${repo}`,
        { headers: headers(pat) }
    )
    if (!repoRes.ok) throw new Error('Could not access repository. Check repo name and PAT.')
    const repoData = await repoRes.json()
    const defaultBranch = repoData.default_branch

    const refRes = await fetch(
        `${BASE}/repos/${repo}/git/ref/heads/${defaultBranch}`,
        { headers: headers(pat) }
    )
    if (!refRes.ok) throw new Error('Could not get default branch ref.')
    const refData = await refRes.json()
    const sha = refData.object.sha

    // Create branch
    const createRes = await fetch(
        `${BASE}/repos/${repo}/git/refs`,
        {
            method: 'POST',
            headers: headers(pat),
            body: JSON.stringify({
                ref: `refs/heads/${branch}`,
                sha,
            }),
        }
    )
    if (!createRes.ok) {
        const err = await createRes.json()
        throw new Error(err.message || 'Could not create branch.')
    }
}

// ── Save project ──────────────────────────────────────
export async function saveProject(pat, repo, branch, sheets) {
  await ensureBranch(pat, repo, branch)

  // Strip large canvas drawings from sheet data — save separately
  const sheetsToSave = sheets.map(sh => {
    const clean = { ...sh }
    // Remove tileData which is not serializable
    // Keep drawing as-is (base64) but warn if too large
    return clean
  })

  // Write project.json
  const projectMeta = {
    version: 1,
    savedAt: new Date().toISOString(),
    sheets: sheetsToSave.map(sh => ({
      id: sh.id,
      name: sh.name,
      type: sh.type,
      createdAt: sh.createdAt,
    })),
  }

  const existingProject = await getFile(pat, repo, branch, 'project.json')
  await writeFile(
    pat, repo, branch,
    'project.json',
    JSON.stringify(projectMeta, null, 2),
    existingProject?.sha || null
  )

  // Write each sheet — catch individual failures
  for (const sheet of sheetsToSave) {
    const path = `sheet-${sheet.id}.json`
    try {
      const content = JSON.stringify(sheet, null, 2)
      // GitHub API has 100MB limit but base64 images can be large
      // Skip if too large
      if (content.length > 5000000) {
        console.warn(`Sheet ${sheet.name} is too large to save (${Math.round(content.length / 1000)}KB), skipping canvas drawings`)
        const lightSheet = {
          ...sheet,
          // Strip storyboard panel drawings
          pages: sheet.pages?.map(pg => ({
            ...pg,
            panels: pg.panels?.map(p => ({ ...p, drawing: null }))
          })),
          // Strip map drawings
          mapLayers: sheet.mapLayers?.map(l => ({ ...l, drawing: null })),
        }
        const existing = await getFile(pat, repo, branch, path)
        await writeFile(pat, repo, branch, path, JSON.stringify(lightSheet, null, 2), existing?.sha || null)
      } else {
        const existing = await getFile(pat, repo, branch, path)
        await writeFile(pat, repo, branch, path, content, existing?.sha || null)
      }
    } catch (err) {
      console.error(`Failed to save sheet ${sheet.name}:`, err)
      throw new Error(`Failed to save sheet "${sheet.name}": ${err.message}`)
    }
  }
}

// ── Load project ──────────────────────────────────────
export async function loadProject(pat, repo, branch) {
    await ensureBranch(pat, repo, branch)

    const projectFile = await getFile(pat, repo, branch, 'project.json')
    if (!projectFile) return [] // nothing saved yet

    const meta = JSON.parse(projectFile.content)
    const sheets = []

    for (const sheetMeta of meta.sheets) {
        const path = `sheet-${sheetMeta.id}.json`
        const file = await getFile(pat, repo, branch, path)
        if (file) {
            sheets.push(JSON.parse(file.content))
        }
    }

    return sheets
}