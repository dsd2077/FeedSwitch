function normalizeSearchValue(value) {
  return String(value ?? "").toLocaleLowerCase()
}

function pageMatchesQuery(pageUrl, pageInfo, query) {
  return [pageUrl, pageInfo?.title].some((value) => normalizeSearchValue(value).includes(query))
}

/**
 * Filter a main-domain -> sub-domain -> page tree without changing any page data.
 * A match at a parent level keeps that parent's complete subtree; a child match
 * keeps only the matching descendant path so callers can preserve the hierarchy.
 */
export function filterWebsiteTree(websiteTree = {}, searchQuery = "") {
  const query = normalizeSearchValue(searchQuery).trim()
  if (!query) {
    return { data: websiteTree, hasQuery: false }
  }

  const filteredTree = {}

  Object.entries(websiteTree || {}).forEach(([mainDomain, subDomains]) => {
    const mainDomainMatches = normalizeSearchValue(mainDomain).includes(query)
    const filteredSubDomains = {}

    Object.entries(subDomains || {}).forEach(([subDomain, pages]) => {
      const subDomainMatches = mainDomainMatches || normalizeSearchValue(subDomain).includes(query)
      const filteredPages = {}

      Object.entries(pages || {}).forEach(([pageUrl, pageInfo]) => {
        if (subDomainMatches || pageMatchesQuery(pageUrl, pageInfo, query)) {
          filteredPages[pageUrl] = pageInfo
        }
      })

      if (subDomainMatches || Object.keys(filteredPages).length > 0) {
        filteredSubDomains[subDomain] = subDomainMatches ? pages : filteredPages
      }
    })

    if (mainDomainMatches || Object.keys(filteredSubDomains).length > 0) {
      filteredTree[mainDomain] = mainDomainMatches ? subDomains : filteredSubDomains
    }
  })

  return { data: filteredTree, hasQuery: true }
}
