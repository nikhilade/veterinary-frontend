import React from "react";
import { useMasterData } from "@/hooks/use-master-data";

export function SpeciesName({ id }: { id: string }) {
  const { data: speciesList = [] } = useMasterData("species");
  const species = (speciesList as Array<{ id: string; name: string }>).find((s) => s.id === id);
  return <span>{species ? species.name : id}</span>;
}

export function BreedName({ id }: { id: string }) {
  const { data: breedsList = [] } = useMasterData("breeds");
  const breed = (breedsList as Array<{ id: string; name: string }>).find((b) => b.id === id);
  return <span>{breed ? breed.name : id}</span>;
}
