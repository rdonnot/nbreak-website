export function densityScaledSize(size:number,w:number,h:number){const scale=Math.sqrt(Math.min(1,(w*h)/(1440*900)));return Math.max(96,Math.min(384,Math.round(size*scale/8)*8))}
