import { useState } from "react";
import {
    APIProvider,
    Map,
    AdvancedMarker,
    InfoWindow,
} from "@vis.gl/react-google-maps";


export default function MapComponent() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY as string;
    const position = { lat: 39.98, lng: -75.15};
    const [open, setOpen] = useState(false);
    if(!apiKey){
        return <div>Error with API key</div>
    }
    return (
        <APIProvider apiKey={apiKey} data-testid="Map">
            <div style={{ height: "100vh", width: "100%" }}>
                <Map defaultZoom={9} defaultCenter={position} rapid={process.env.GOOGLE_MAPS_ID}>
                    <AdvancedMarker position={position}></AdvancedMarker>
                
                {open && (
                    <InfoWindow position={position} onCloseClick={() => setOpen(false)}>
                        <p>I'm in Temple</p>
                    </InfoWindow>
                )}
                </Map>
            </div>
        </APIProvider>
    )
};
