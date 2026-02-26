"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Map,
  Marker,
  type MapMouseEvent,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

const DEFAULT_CENTER = { lat: -23.55052, lng: -46.633308 };

type LocationFieldProps = {
  value: string;
  onAddressChange: (address: string) => void;
  onPointChange: (point: google.maps.LatLngLiteral) => void;
};

export function LocationField({
  value,
  onAddressChange,
  onPointChange,
}: LocationFieldProps) {
  const placesLibrary = useMapsLibrary("places");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const skipNextSearchRef = useRef(false);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const [userCenter, setUserCenter] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const mapCenter = useMemo(
    () => position ?? userCenter ?? DEFAULT_CENTER,
    [position, userCenter]
  );

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (coords) => {
        setUserCenter({
          lat: coords.coords.latitude,
          lng: coords.coords.longitude,
        });
      },
      () => {
        // Se o usuario negar permissao, mantemos o centro padrao.
      }
    );
  }, []);

  useEffect(() => {
    if (!placesLibrary) return;
    autocompleteServiceRef.current = new placesLibrary.AutocompleteService();
    placesServiceRef.current = new placesLibrary.PlacesService(
      document.createElement("div")
    );
  }, [placesLibrary]);

  useEffect(() => {
    const autocompleteService = autocompleteServiceRef.current;
    if (!autocompleteService) return;

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const query = value.trim();
    if (query.length < 3) {
      return;
    }

    const timer = window.setTimeout(() => {
      autocompleteService.getPlacePredictions(
        { input: query, types: ["geocode"] },
        (predictions, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !predictions
          ) {
            setSuggestions([]);
            return;
          }

          setSuggestions(predictions);
        }
      );
    }, 750);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value]);

  function reverseGeocode(point: google.maps.LatLngLiteral) {
    if (!window.google?.maps) return;

    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    geocoderRef.current.geocode({ location: point }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        skipNextSearchRef.current = true;
        onAddressChange(results[0].formatted_address);
      }
    });
  }

  function handleMapClick(event: MapMouseEvent) {
    const latLng = event.detail.latLng;
    if (!latLng) return;

    setPosition(latLng);
    onPointChange(latLng);
    reverseGeocode(latLng);
    setSuggestions([]);
  }

  function handleMarkerDragEnd(event: google.maps.MapMouseEvent) {
    const latLng = event.latLng;
    if (!latLng) return;

    const nextPoint = { lat: latLng.lat(), lng: latLng.lng() };
    setPosition(nextPoint);
    onPointChange(nextPoint);
    reverseGeocode(nextPoint);
    setSuggestions([]);
  }

  function handleSelectSuggestion(
    suggestion: google.maps.places.AutocompletePrediction
  ) {
    const placesService = placesServiceRef.current;
    if (!placesService) return;

    skipNextSearchRef.current = true;
    onAddressChange(suggestion.description);
    setSuggestions([]);

    placesService.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ["formatted_address", "geometry"],
      },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          return;
        }

        const location = place.geometry?.location;
        if (!location) return;

        const nextPoint = { lat: location.lat(), lng: location.lng() };
        setPosition(nextPoint);
        onPointChange(nextPoint);
        skipNextSearchRef.current = true;
        onAddressChange(place.formatted_address ?? suggestion.description);
      }
    );
  }

  function handleInputChange(nextValue: string) {
    setSuggestions([]);
    onAddressChange(nextValue);
  }

  return (
    <div className="location-group">
      <div className="location-autocomplete">
        <label>
          Localizacao
          <input
            required
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Busque e selecione um endereco"
          />
        </label>
        {suggestions.length > 0 ? (
          <ul className="location-suggestions">
            {suggestions.map((suggestion) => (
              <li key={suggestion.place_id}>
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.description}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="map-wrapper">
        <Map
          defaultCenter={mapCenter}
          defaultZoom={15}
          onClick={handleMapClick}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        >
          {position ? (
            <Marker
              position={position}
              draggable
              onDragEnd={handleMarkerDragEnd}
            />
          ) : null}
        </Map>
      </div>
      <p className="map-help">
        Selecione um endereco e ajuste o marcador para o ponto exato.
      </p>
    </div>
  );
}
