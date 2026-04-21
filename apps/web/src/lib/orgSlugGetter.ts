/** Set by OrgProvider so api() can attach X-Organization-Slug. */
let getter: () => string | null = () => null

export function setOrgSlugGetter(fn: () => string | null) {
  getter = fn
}

export function getOrgSlugForApi(): string | null {
  return getter()
}
