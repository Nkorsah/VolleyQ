/// <reference types="@types/google.maps" />
"use client";
import { useState } from "react";
import {
    APIProvider,
    Map,
    AdvancedMarker,
    InfoWindow,
} from "@vis.gl/react-google-maps";

export default function Maps() {
    const position = { lat: 39.98, lng: -75.15};
    const [open, setOpen] = useState(false);
    return (
        <APIProvider apiKey={process.env.GOOGLE_MAPS_API_KEY}>
            <div style={{ height: "100vh", width: "100%" }}>
                <Map zoom={9} center={position} rapid={process.env.GOOGLE_MAPS_ID}>
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
