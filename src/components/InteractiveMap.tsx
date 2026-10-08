import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Hotspot, WasteReport } from '../types';
import { getCategoryInfo } from '../utils/categories';

// Fix Leaflet's default icon assets in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface InteractiveMapProps {
  reports?: WasteReport[];
  hotspots?: Hotspot[];
  selectedReportId?: string;
  onSelectReport?: (report: WasteReport) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  isPickerMode?: boolean;
  pickedPosition?: [number, number];
  onPickPosition?: (lat: number, lng: number) => void;
  showHeatmap?: boolean;
  onCommunityVote?: (reportId: string, vote: 'still_there' | 'cleaned' | 'worsened') => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  reports = [],
  hotspots = [],
  selectedReportId,
  onSelectReport,
  center = [13.0827, 80.2707],
  zoom = 13,
  height = '480px',
  isPickerMode = false,
  pickedPosition,
  onPickPosition,
  showHeatmap = false,
  onCommunityVote,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: pickedPosition || center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | CleanSpot Civic GIS',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      heatmapLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      if (isPickerMode && onPickPosition) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onPickPosition(e.latlng.lat, e.latlng.lng);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update in Picker Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isPickerMode) return;

    const pos = pickedPosition || center;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.setLatLng(pos);
    } else {
      const pinIcon = L.divIcon({
        className: 'cleanspot-picker-pin',
        html: `
          <div style="background-color: #059669; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
            <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      const marker = L.marker(pos, { draggable: true, icon: pinIcon }).addTo(map);
      marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        onPickPosition?.(newPos.lat, newPos.lng);
      });
      pickerMarkerRef.current = marker;
    }

    map.panTo(pos);
  }, [pickedPosition, isPickerMode]);

  // Handle Heatmap and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const heatLayer = heatmapLayerRef.current;
    if (!map || !markersLayer || !heatLayer || isPickerMode) return;

    markersLayer.clearLayers();
    heatLayer.clearLayers();

    // 1. Render Heatmap Concentration if enabled
    if (showHeatmap) {
      reports.forEach((r) => {
        const heatCircle = L.circle([r.location.latitude, r.location.longitude], {
          radius: 180,
          color: r.severity === 'critical' ? '#EF4444' : '#F59E0B',
          fillColor: r.severity === 'critical' ? '#EF4444' : '#F59E0B',
          fillOpacity: 0.25,
          weight: 0,
        }).addTo(heatLayer);
      });
    }

    // 2. Render Hotspot Radii
    hotspots.forEach((hs) => {
      let color = '#EF4444'; // critical
      if (hs.severityLevel === 'high') color = '#F97316';
      else if (hs.severityLevel === 'medium') color = '#EAB308';

      const circle = L.circle([hs.center.latitude, hs.center.longitude], {
        color,
        fillColor: color,
        fillOpacity: 0.16,
        radius: hs.radiusMeters,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(markersLayer);

      circle.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; max-width: 210px; padding: 2px;">
          <div style="font-weight: 700; color: ${color}; font-size: 13px; margin-bottom: 4px;">🔥 ${hs.name}</div>
          <div style="margin-bottom: 2px;"><strong>Hotspot Score:</strong> ${hs.score}/100</div>
          <div style="margin-bottom: 2px;"><strong>Recurrence:</strong> ${hs.incidentCount} reports</div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.3;">
            <strong>Preventive Recommendation:</strong> ${hs.recommendedIntervention}
          </div>
        </div>
      `);
    });

    // 3. Render Incident Markers
    reports.forEach((report) => {
      let pinColor = '#EF4444'; // Red = Critical
      if (report.status === 'RESOLVED') {
        pinColor = '#10B981'; // Green = Resolved
      } else if (report.severity === 'critical') {
        pinColor = '#EF4444'; // Red = Critical
      } else if (report.severity === 'high') {
        pinColor = '#F97316'; // Orange = High
      } else if (report.severity === 'medium') {
        pinColor = '#EAB308'; // Yellow = Medium
      } else {
        pinColor = '#10B981'; // Low
      }

      const isSelected = report.id === selectedReportId;
      const catInfo = getCategoryInfo(report.category);

      const markerHtml = `
        <div style="
          background-color: ${pinColor};
          width: ${isSelected ? '32px' : '26px'};
          height: ${isSelected ? '32px' : '26px'};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: ${isSelected ? '3px solid #0F172A' : '2px solid white'};
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'cleanspot-marker',
        html: markerHtml,
        iconSize: isSelected ? [32, 32] : [26, 26],
        iconAnchor: isSelected ? [16, 32] : [13, 26],
      });

      const marker = L.marker([report.location.latitude, report.location.longitude], {
        icon,
      }).addTo(markersLayer);

      marker.on('click', () => {
        if (onSelectReport) onSelectReport(report);
      });

      const votesCount =
        (report.communityVotes?.stillThere || 0) + (report.communityVotes?.worsened || 0);

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; width: 220px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #0F172A; font-size: 13px;">${report.id}</strong>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 9999px; background: ${pinColor}22; color: ${pinColor}; font-weight: 700; text-transform: uppercase;">
              ${report.severity}
            </span>
          </div>

          <div style="width: 100%; height: 95px; border-radius: 8px; overflow: hidden; background: #F1F5F9; margin-bottom: 6px;">
            <img src="${report.imageUrls[0]}" style="width: 100%; height: 100%; object-fit: cover;" alt="Report" />
          </div>

          <div style="font-weight: 700; color: #1E293B; margin-bottom: 2px;">${catInfo.label}</div>
          <div style="color: #64748B; font-size: 11px; margin-bottom: 6px; line-height: 1.3;">
            📍 ${report.location.approximateLocation || report.location.formattedAddress}
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #334155; margin-bottom: 6px; border-top: 1px solid #F1F5F9; padding-top: 4px;">
            <span>Status: <strong style="text-transform: capitalize;">${report.status.replace(/_/g, ' ').toLowerCase()}</strong></span>
            ${votesCount > 0 ? `<span style="color: #059669; font-weight: 600;">👥 ${votesCount} votes</span>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
    });
  }, [reports, hotspots, selectedReportId, isPickerMode, showHeatmap]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className="rounded-2xl overflow-hidden shadow-inner border border-slate-200"
    />
  );
};
