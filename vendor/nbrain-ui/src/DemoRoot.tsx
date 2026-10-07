import * as React from 'react';
import App from './App';
import WidgetGallery from './WidgetGallery';
import RadialPage from './RadialLab';
export default function DemoRoot(){const [hash,setHash]=React.useState(location.hash);React.useEffect(()=>{const update=()=>setHash(location.hash);window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update)},[]);return hash.startsWith('#/radial')?<RadialPage/>:hash.startsWith('#/widgets')?<WidgetGallery/>:<App/>}
