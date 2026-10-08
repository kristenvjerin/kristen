import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Hotspot, WasteReport } from '../types';
import { getCategoryInfo } from '../utils/categories';

// Fix Leaflet default icon assets in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface InteractiveMapProps {
  reports?: WasteReport[];
  hotspots?: Hotspot[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onSelectReport?: (report: WasteReport) => void;
  selectedReportId?: string;
  isPickerMode?: boolean;
  onPickPosition?: (lat: number, lng: number) => void;
  pickedPosition?: [number, number];
  showHeatmap?: boolean;
  onCommunityVote?: (reportId: string, vote: 'still_there' | 'cleaned' | 'worsened') => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  reports = [],
  hotspots = [],
  center = [13.0827, 80.2707], // Metro City default
  zoom = 13,
  height = '420px',
  onSelectReport,
  selectedReportId,
  isPickerMode = false,
  onPickPosition,
  pickedPosition,
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

    if (!pickerMarkerRef.current) {
      const pickerIcon = L.divIcon({
        className: 'picker-marker',
        html: `
          <div style="
            background-color: #176B45;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
          ">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      pickerMarkerRef.current = L.marker(pos, {
        icon: pickerIcon,
        draggable: true,
      }).addTo(map);

      pickerMarkerRef.current.on('dragend', (e) => {
        const marker = e.target;
        const newPos = marker.getLatLng();
        if (onPickPosition) {
          onPickPosition(newPos.lat, newPos.lng);
        }
      });
    } else {
      pickerMarkerRef.current.setLatLng(pos);
    }
  }, [pickedPosition, isPickerMode]);

  // Update Markers, Hotspot Areas, and Heat Density
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const heatLayer = heatmapLayerRef.current;
    if (!map || !markersLayer || !heatLayer || isPickerMode) return;

    markersLayer.clearLayers();
    heatLayer.clearLayers();

    // 1. Density Layer (Subtle, non-neon, analytical)
    if (showHeatmap) {
      reports.forEach((r) => {
        L.circle([r.location.latitude, r.location.longitude], {
          radius: 160,
          color: r.severity === 'critical' ? '#DC2626' : '#D97706',
          fillColor: r.severity === 'critical' ? '#DC2626' : '#D97706',
          fillOpacity: 0.18,
          weight: 0,
        }).addTo(heatLayer);
      });
    }

    // 2. Hotspot Cluster Boundary Circles
    hotspots.forEach((hs) => {
      let color = '#DC2626'; // critical
      if (hs.severityLevel === 'high') color = '#D97706';
      else if (hs.severityLevel === 'medium') color = '#2563EB';

      const circle = L.circle([hs.center.latitude, hs.center.longitude], {
        color,
        fillColor: color,
        fillOpacity: 0.12,
        radius: hs.radiusMeters,
        weight: 1.5,
        dashArray: '4, 4',
      }).addTo(markersLayer);

      circle.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; max-width: 220px; padding: 2px;">
          <div style="font-weight: 700; color: ${color}; font-size: 13px; margin-bottom: 3px;">${hs.name}</div>
          <div style="color: #475569; font-size: 11px; margin-bottom: 2px;">Hotspot Score: <strong>${hs.score}/100</strong></div>
          <div style="color: #475569; font-size: 11px; margin-bottom: 3px;">Recurrence: <strong>${hs.incidentCount} reports</strong></div>
          <div style="font-size: 11px; color: #334155; margin-top: 4px; padding-top: 4px; border-top: 1px solid #E2E8E4; line-height: 1.35;">
            <strong>Recommendation:</strong> ${hs.recommendedIntervention}
          </div>
        </div>
      `);
    });

    // 3. Professional Incident Markers (Small circular marker with clear severity color)
    reports.forEach((report) => {
      let pinColor = '#DC2626'; // Critical
      if (report.status === 'RESOLVED') {
        pinColor = '#16A34A'; // Resolved
      } else if (report.severity === 'critical') {
        pinColor = '#DC2626'; // Red
      } else if (report.severity === 'high') {
        pinColor = '#D97706'; // Amber
      } else if (report.severity === 'medium') {
        pinColor = '#2563EB'; // Blue
      } else {
        pinColor = '#16A34A'; // Green
      }

      const isSelected = report.id === selectedReportId;
      const catInfo = getCategoryInfo(report.category);

      const markerHtml = `
        <div style="
          background-color: ${pinColor};
          width: ${isSelected ? '24px' : '18px'};
          height: ${isSelected ? '24px' : '18px'};
          border-radius: 50%;
          border: ${isSelected ? '3px solid #0F172A' : '2px solid #FFFFFF'};
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease;
        ">
          <div style="
            width: 6px;
            height: 6px;
            background: #FFFFFF;
            border-radius: 50%;
          "></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'cleanspot-marker',
        html: markerHtml,
        iconSize: isSelected ? [24, 24] : [18, 18],
        iconAnchor: isSelected ? [12, 12] : [9, 9],
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
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; width: 220px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #0F172A; font-size: 13px;">${report.id}</strong>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${pinColor}18; color: ${pinColor}; font-weight: 700; text-transform: uppercase;">
              ${report.severity}
            </span>
          </div>

          <div style="width: 100%; height: 95px; border-radius: 6px; overflow: hidden; background: #F1F5F9; margin-bottom: 6px;">
            <img src="${report.imageUrls[0]}" style="width: 100%; height: 100%; object-fit: cover;" alt="Report site" />
          </div>

          <div style="font-weight: 600; color: #1E293B; margin-bottom: 2px;">${catInfo.label}</div>
          <div style="color: #64748B; font-size: 11px; margin-bottom: 6px; line-height: 1.35;">
            ${report.location.approximateLocation || report.location.formattedAddress}
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #334155; margin-bottom: 4px; border-top: 1px solid #E2E8E4; padding-top: 4px;">
            <span>Status: <strong style="text-transform: capitalize;">${report.status.replace(/_/g, ' ').toLowerCase()}</strong></span>
            ${votesCount > 0 ? `<span style="color: #16A34A; font-weight: 600;">${votesCount} confirmations</span>` : ''}
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
      className="rounded-[10px] overflow-hidden border border-[#E2E8E4]"
    />
  );
};
