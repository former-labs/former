// import { useLocalStorage } from 'usehooks-ts'

// export function useDebugMode() {
//   const [debugMode] = useLocalStorage('VERVE_DEBUG_MODE', false)
//   return debugMode
// }

export function getDebugMode() {
  const debugMode = localStorage.getItem('VERVE_DEBUG_MODE')
  return debugMode === 'true'
}
