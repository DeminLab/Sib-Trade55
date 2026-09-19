import type { MaterialRepository, MaterialSpec, RalColor } from "@/types"
import data from "@/data/materials.json"

const materials = data.materials as MaterialSpec[]
const coatings = data.coatings as MaterialSpec[]
const ralColors = data.ralColors as RalColor[]

export const jsonMaterialRepository: MaterialRepository = {
  async listMaterials() {
    return [...materials]
  },
  async listCoatings() {
    return [...coatings]
  },
  async listRalColors() {
    return [...ralColors]
  },
}
