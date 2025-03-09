const secrets = require("./secrets");

var firebase = require( 'firebase/app' );
var nodeimu = require( '@trbll/nodeimu' );
var IMU = new nodeimu.IMU( );
var sense = require( '@trbll/sense-hat-led' );
const { getDatabase, ref, onValue, set, update, get } = require('firebase/database');

const app = firebase.initializeApp(secrets);
const database = getDatabase();

// Define Firebase database structure
const databaseStructure = ref(database, "/");
set(databaseStructure, {
      temperature: 0,
      humidity: 0,
      update_light: false,
      light_info: {
          light_r: 0,
          light_g: 0,
          light_b: 0,
          light_row: 0,
          light_col: 0
      }
});

function updateSensorData() {
    IMU.getValue((error, data) => {
        if (error) {
            console.error("Error reading IMU data:", error);
            return;
        }
        const temp = data.temperature;
        const humidity = data.humidity;

        update(ref(database, "/"), {
            temperature: temp,
            humidity: humidity
        });

        console.log(`Updated Temp: ${temp}°C, Humidity: ${humidity}%`);
    });
}

setInterval(updateSensorData, 5000);  // Run every 5 seconds


onValue(ref(database, "/update_light"), (snapshot) => {
    if (snapshot.val()) {
        get(ref(database, "/light_info")).then((lightSnapshot) => {
	    if (!lightSnapshot.val()) return;
            const lightData = lightSnapshot.val();

	    console.log(lightData)

            // Set LED color
            const color = [lightData.light_r, lightData.light_g, lightData.light_b];
            sense.setPixel(lightData.light_row, lightData.light_col, color);

            console.log(`LED updated: Row=${lightData.light_row}, Col=${lightData.light_col}, Color=${color}`);

            // Reset update_light to false
            update(ref(database, "/"), { update_light: false });
        });
    }
});

