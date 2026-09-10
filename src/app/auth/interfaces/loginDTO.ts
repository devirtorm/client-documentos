export interface LoginDTO {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken?: string;
  tokenType?: string;
  user?: string;
  agente?: string;
  almacen?: string;
}
