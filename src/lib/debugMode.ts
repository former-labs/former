// import { useLocalStorage } from 'usehooks-ts'

// export function useDebugMode() {
//   const [debugMode] = useLocalStorage('FORMER_DEBUG_MODE', false)
//   return debugMode
// }

export function getDebugMode() {
  const debugMode = localStorage.getItem('FORMER_DEBUG_MODE')
  return debugMode === 'true'
}
