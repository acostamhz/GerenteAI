export interface JwtPayload {
  sub: string; // id del usuario
  negocioId: string;
  role: string;
  rolGlobal: 'MASTER' | 'CLIENTE' ;
}