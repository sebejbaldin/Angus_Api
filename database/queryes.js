module.exports = {
    influx: {
        energyConsumption_Instant: `select value from testdata
        where sensor_id=13 or sensor_id=16 or sensor_id=19 or sensor_id=22 or sensor_id=25 
        and time > now() -1s                
        limit 1`,
        waterConsumption_Instant: `select value from testdata 
        where time > now() -1s 
        and sensor_id=28 or sensor_id=29 or sensor_id=30
        limit 1`,    
        uptime_Instant: `select value from testdata        
        where time > now() -1s  
        and sensor_id=27 or sensor_id=24 or sensor_id=21 or sensor_id=18 or sensor_id=15
        limit 1`,  
        averageEnergy_Week: 'select mean(*) from seb_sum_e_global',
        //averageWater_Week: '',
        energyDrainBySensor_Minute_Global: 'select sum(value) from testdata where time > now() - 1m and sensor_id=13 or sensor_id=16 or sensor_id=19 or sensor_id=22 or sensor_id=25 group by tag_sensor_id',
        waterTankLevel_Day_Max: 'select max(value) from testdata where time > now() - 1h and sensor_id=7 or sensor_id=9 or sensor_id=11 group by tag_sensor_id order by time desc',
        waterTankLevel_Day_Min: 'select min(value) from testdata where time > now() - 1h and sensor_id=7 or sensor_id=9 or sensor_id=11 group by tag_sensor_id order by time desc',
        GetSensorValue_Instant_Grouped: 'select value from testdata where time > now() group by tag_sensor_id limit 1',
        timespan: {
            minute: '1m',
            hour: '1h',
            day: '24h',
            week: '7d',
            month: '30d',
            year: '365d'
        },
        GetEnergyConsuption_Instant_Single: (sensor_id) => {
            return `select value from testdata 
            where time > now()
            and sensor_id=${sensor_id}
            limit 1`
        },
        GetSensorValue_Average_Single: (sensor_id, timespan) => {            
            if (timespan) {
                return `select mean(value) from testdata 
                where sensor_id=${sensor_id} and time > now() - ${timespan}`;
            }
            return `select mean(value) from testdata 
            where sensor_id=${sensor_id}`;
        },
        GetSensorValue_Average_Grouped: (timespan) => {            
            if (timespan) {
                return `select mean(value) from testdata 
                where time > now() - ${timespan}
                group by tag_sensor_id`;                
            }
            return `select mean(value) from testdata 
            group by tag_sensor_id`;
        },
        GetEnergyConsuption_Average: (timespan) => {
            if(timespan) {
                return `select mean(value) from testdata 
                where time > now() - ${timespan} 
                and sensor_id=13 or sensor_id=16 or sensor_id=19 or sensor_id=22 or sensor_id=25`;
            }
            return `select mean(value) from testdata 
            where sensor_id=13 or sensor_id=16 or sensor_id=19 or sensor_id=22 or sensor_id=25`;
        },
        GetEnergyConsuption_Total: (timespan) => {
            if (timespan) {
                return `select sum(value) from testdata 
                where time > now() - ${timespan}
                and sensor_id=13 or sensor_id=16 or sensor_id=19 or sensor_id=22 or sensor_id=25`;
            }
            return `select sum(value) from testdata 
            where sensor_id=13 or sensor_id=16 or sensor_id=19 or sensor_id=22 or sensor_id=25`
        },
        GetWaterConsuption_Average: (timespan) => {
            if (timespan) {
                return `select mean(value) from testdata 
                where time > now() - ${timespan} 
                and sensor_id=28 or sensor_id=29 or sensor_id=30`;
            }
            return `select sum(value) from testdata 
            where sensor_id=28 or sensor_id=29 or sensor_id=30`;
        },
        GetWaterConsuption_Total: (timespan) => {
            if (timespan) {
                return `select sum(value) from testdata 
                where time > now() - ${timespan} 
                and sensor_id=28 or sensor_id=29 or sensor_id=30`;                
            }
            return `select sum(value) from testdata 
            where sensor_id=28 or sensor_id=29 or sensor_id=30`;
        },
        GetUptime_Average: (timespan) => {
            if (timespan) {
                return `select mean(value) from testdata
                where time > now() - ${timespan}
                and sensor_id=27 or sensor_id=24 or sensor_id=21 or sensor_id=18 or sensor_id=15`;
            }
            return `select mean(value) from testdata
                where sensor_id=27 or sensor_id=24 or sensor_id=21 or sensor_id=18 or sensor_id=15`;
        }
    }
}