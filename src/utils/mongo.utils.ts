/**
 * Utilidades para trabajar con MongoDB
 */
export class MongoUtils {
  /**
   * Valida si un string es un ObjectId válido de MongoDB
   * @param id String a validar
   * @returns true si es un ObjectId válido
   */
  static isValidObjectId(id: string | undefined | null): boolean {
    if (!id) return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Convierte un string a ObjectId si es válido
   * @param id String a convertir
   * @returns El ObjectId si es válido, null si no lo es
   */
  static toObjectId(id: string | undefined | null): string | null {
    if (!this.isValidObjectId(id)) return null;
    return id as string;
  }

  /**
   * Valida y convierte un array de IDs
   */
  static validateIds(ids: (string | undefined | null)[]): string[] {
    return ids
      .filter(id => this.isValidObjectId(id))
      .map(id => id as string);
  }

  /**
   * Valida un ID y lanza un error si no es válido
   */
  static validateIdOrThrow(id: string | undefined | null, entityName: string = 'entidad'): string {
    if (!this.isValidObjectId(id)) {
      throw new Error(`ID de ${entityName} inválido`);
    }
    return id as string;
  }
} 