/**
 * Aviso de "401 en cualquier request" (handoff C3). Lo disparan `http.ts` y los mocks;
 * lo escucha el composition root (`main.ts`), que limpia la sesión y manda a /login.
 * Así ni los services ni los stores necesitan importar el router.
 */
type Escucha = () => void

let escucha: Escucha | undefined

/** Registra quién reacciona a un 401. Solo hay una escucha: la última registrada reemplaza a la anterior. */
export function alRecibirNoAutorizado(nueva: Escucha | undefined): void {
  escucha = nueva
}

export function avisarNoAutorizado(): void {
  escucha?.()
}
