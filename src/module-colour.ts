import type { Row } from './domain';

export const moduleColours=['Rose','Plum','Blue','Teal','Amber','Coral'] as const;

export function moduleColour(module?:Row){
 if(moduleColours.some(colour=>colour===module?.colour))return module!.colour as typeof moduleColours[number];
 let hash=0;
 for(const char of module?.id||'')hash=(Math.imul(31,hash)+char.charCodeAt(0))>>>0;
 return moduleColours[hash%moduleColours.length];
}
