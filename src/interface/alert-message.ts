export interface AlertMessage {
  texto: string;
  tipo?: 'info' | 'success' | 'error' | 'warning';
}