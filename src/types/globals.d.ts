export { }

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      onboarding_complete?: boolean
    }
  }
}