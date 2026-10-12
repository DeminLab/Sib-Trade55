import type { MaterialRepository, MaterialSpec, RalColor } from "@/types"
import { readSqliteContent } from "@/lib/database/sqlite-store"

export const sqliteMaterialRepository: MaterialRepository = {
  async listMaterials() {
    const { materials } = await readSqliteContent<{ materials: MaterialSpec[] }>("materials")
    return [...materials]
  },
  async listCoatings() {
    const { coatings } = await readSqliteContent<{ coatings: MaterialSpec[] }>("materials")
    return [...coatings]
  },
  async listRalColors() {
    const { ralColors } = await readSqliteContent<{ ralColors: RalColor[] }>("materials")
    return [...ralColors]
  },
}
