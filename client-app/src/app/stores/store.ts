import { createContext, useContext } from "react";
import ActivityStore from "./activityStore";

interface Store {
    activityStore: ActivityStore
}

export const store: Store = {
    activityStore: new ActivityStore()
}

export const StoreContext = createContext(store);

// se crea un react hook para acceder al contexto de los almacenes
// (de momento uno)
export function useStore() {
    return useContext(StoreContext);
}