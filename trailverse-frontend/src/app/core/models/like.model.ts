/** Estado de los likes de una ruta: total y si el usuario actual le ha dado like. */
export interface LikeEstado {
  total: number;
  likedByMe: boolean;
}
