import React, { useState } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Phone } from 'lucide-react';

interface StudioMapProps {
  address: string;
  whatsappNumber: string;
}

// Olorunsogo, Ado Ekiti, Ekiti State coordinates
const STUDIO_COORDINATES = { lat: 7.6236, lng: 5.2342 };

const StudioMarkerWithInfo: React.FC<{ address: string; whatsappNumber: string }> = ({
  address,
  whatsappNumber,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(true);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={STUDIO_COORDINATES}
        onClick={() => setInfoOpen((prev) => !prev)}
        title="EUCHARIA Stitches – Olorunsogo, Ado Ekiti"
      >
        <Pin
          background="#C5A059"
          borderColor="#1A1412"
          glyphColor="#1A1412"
          scale={1.25}
        />
      </AdvancedMarker>
      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={280}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="p-1 text-[#1A1412] font-sans-body">
            <p className="font-serif-display font-bold text-base text-[#1A1412]">
              EUCHARIA Stitches
            </p>
            <p className="text-xs text-[#5C4E47] mt-1 leading-relaxed">
              {address}
            </p>
            <p className="text-xs font-mono-num text-[#1A1412] mt-1.5">
              WhatsApp: {whatsappNumber}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                'Olorunsogo Ado Ekiti Ekiti State Nigeria'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#9E7B36] hover:underline"
            >
              <Navigation className="w-3 h-3" />
              Open in Google Maps
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const StudioMap: React.FC<StudioMapProps> = ({ address, whatsappNumber }) => {
  const apiKey =
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
    (import.meta.env.GOOGLE_MAPS_API_KEY as string | undefined) ||
    '';

  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Road 1, Zone 8, Olorunsogo, Ado Ekiti, Ekiti State, Nigeria'
  )}`;

  if (!apiKey || apiKey === 'MY_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="h-[420px] w-full rounded-xl border border-[#E6DEC8] bg-[#F5EFE6] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#1A1412] text-[#C5A059] flex items-center justify-center mb-4">
          <MapPin className="w-6 h-6" />
        </div>
        <h3 className="font-serif-display text-2xl font-semibold text-[#1A1412]">
          EUCHARIA Stitches Atelier
        </h3>
        <p className="text-sm text-[#5C4E47] max-w-md mt-2 leading-relaxed">
          {address}
        </p>
        <p className="text-xs font-mono-num text-[#7A6B63] mt-2">
          Coordinates: 7.6236° N, 5.2342° E · Ado Ekiti, Nigeria
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <a
            href={googleMapsExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
          >
            <Navigation className="w-3.5 h-3.5 text-[#C5A059]" />
            Get Directions on Google Maps
          </a>
          <a
            href={`tel:${whatsappNumber}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#1A1412]/25 text-[#1A1412] text-xs font-medium rounded-lg hover:bg-[#1A1412]/5 transition-colors whitespace-nowrap shrink-0"
          >
            <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
            Call {whatsappNumber}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[420px] w-full rounded-xl overflow-hidden border border-[#E6DEC8] relative">
      <APIProvider apiKey={apiKey} libraries={['marker']} region="NG" language="en">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={STUDIO_COORDINATES}
          defaultZoom={15}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <StudioMarkerWithInfo address={address} whatsappNumber={whatsappNumber} />
        </GoogleMap>
      </APIProvider>
    </div>
  );
};
