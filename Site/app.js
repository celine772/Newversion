// BEHAVIOUR: what happens on the page. Runs top to bottom when the page loads.
// Lab 3. Parts 6 to 8 of the handout ask you to change the lines marked PART.

const map = L.map('map', { preferCanvas: true }).setView([45.5013, -73.5555], 12);   // [latitude, longitude]: Montreal
map.createPane('wifiGridPane');
map.getPane('wifiGridPane').style.zIndex = 350;

const wifiLayer = L.layerGroup().addTo(map);
const touristLayer = L.layerGroup().addTo(map);

const wifiGridColours = {
  none: '#f1f5f9',
  low: '#a7f3d0',
  medium: '#fde047',
  high: '#fb923c',
  veryHigh: '#dc2626'
};

function colourFor(count) {
  if (count >= 41) return wifiGridColours.veryHigh;
  if (count >= 31) return wifiGridColours.high;
  if (count >= 21) return wifiGridColours.medium;
  if (count >= 1) return wifiGridColours.low;
  return wifiGridColours.none;
}

const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  const rows = [[41, '41 or more'], [31, '31 to 40'], [21, '21 to 30'],
  [1, '1 to 20'], [0, 'none']];
  const items = rows.map(function (row) {
    return '<i style="background:' + colourFor(row[0]) + '"></i>' + row[1];
  });
  div.innerHTML = '<strong>Wi-Fi spots per 1000 m grid cell</strong><br>' + items.join('<br>');
  return div;
};
legend.addTo(map);

L.control.layers(null, {
  'Wi-Fi spots (points and grid)': wifiLayer,
  'Tourist attractions': touristLayer
}, { collapsed: false }).addTo(map);

// Base map: OpenStreetMap. It needs the page served by Live Server, which is how
// this lab opens it. A page opened by double-click gets "Access blocked" tiles.
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

fetch('../Data/wifi_grid.geojson')
  .then(function (response) {
    if (!response.ok) { throw new Error('HTTP ' + response.status + ' loading wifi_grid.geojson'); }
    return response.json();
  })
  .then(function (data) {
    L.geoJSON(data, {
      pane: 'wifiGridPane',
      style: function (feature) {
        const fill = colourFor(feature.properties.wifi_count);
        return { color: fill, weight: 0.4, fillColor: fill, fillOpacity: 0.65 };
      },
      onEachFeature: function (feature, layer) {
        const p = feature.properties;
        layer.bindPopup(p.wifi_count + ' Wi-Fi spot(s) in this 1000 m cell');
      }
    }).addTo(wifiLayer);
  })
  .catch(function (err) {
    console.error('Could not load the Wi-Fi grid.', err);
  });

// How many Wi-Fi locations to draw.
const LIMIT = Infinity;
const markerColor = '#2563eb';

fetch('../Data/internet.geojson')
  .then(function (response) {
    if (!response.ok) { throw new Error('HTTP ' + response.status + ' loading internet.geojson'); }
    return response.json();
  })
  .then(function (data) {
    const shown = { type: 'FeatureCollection', features: data.features.slice(0, LIMIT) };

    L.geoJSON(shown, {
      pointToLayer: function (feature, latlng,) {
        return L.circleMarker(latlng, { radius: 4, weight: 1, fillOpacity: 0.8, fillColor: markerColor });
      }, onEachFeature: function (feature, layer) {
        const p = feature.properties;
        layer.bindPopup('<strong>' + p.lieu + '</strong><br>' +
          'Type: ' + p.wifi_type + '<br>Arrondissement: ' + p.arrondissement);
      }

    }).addTo(wifiLayer);

    document.getElementById('status').textContent =
      shown.features.length + ' of ' + data.features.length + ' Wi-Fi locations shown';
  })
  .catch(function (err) {
    document.getElementById('status').textContent =
      'Could not load internet.geojson. Open the console (F12) for details.';
    console.error(err);
  });

// Tourist attractions are loaded as a separate overlay; the Wi-Fi layer above is unchanged.
fetch('../Data/tourist_attractions.geojson')
  .then(function (response) {
    if (!response.ok) { throw new Error('HTTP ' + response.status + ' loading tourist_attractions.geojson'); }
    return response.json();
  })
  .then(function (data) {
    const touristMarkerColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--tourist-marker').trim();
    L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 7,
          color: touristMarkerColor,
          weight: 1,
          fillOpacity: 0.9,
          fillColor: touristMarkerColor
        });
      },
      onEachFeature: function (feature, layer) {
        const p = feature.properties;
        layer.bindPopup('<strong>' + p.name + '</strong><br>' +
          'Type: ' + p.type + '<br>Arrondissement: ' + p.borough);
      }
    }).addTo(touristLayer);
  })
  .catch(function (err) {
    console.error('Could not load tourist attractions.', err);
  });
