module.exports = {
    /* washPreRPMInstant: "select * from testdata where sensor_id=14 order by time desc limit 1",
    washPreRPMLastMinute: "select mean(value) from testdata where sensor_id=14 and time > now() - 1m order by time desc",
    washPreRPMLastDay: "select mean(value) from testdata where sensor_id=14 and time > now() - 24h order by time desc",
    washPreRPMLastWeek: "select mean(value) from testdata where sensor_id=14 and time > now() - 7d order by time desc",
    washPreRPMLastMonth: "select mean(value) from testdata where sensor_id=14 and time > now() - 30d order by time desc",
    washPreRPMLastYear: "select mean(value) from testdata where sensor_id=14 and time > now() - 356d order by time desc",
 */
    influx: {
        energyDrain_Minute_Global: "select sum(value) from testdata where time > now() - 1m and sensor_id=13 or sensor_id=16 or sensor_id=19 or sensor_id=22 or sensor_id=25",
        energyDrainBySensor_Minute_Global: energyDrain_Minute_Global + "group by tag_sensor_id",
        waterConsumption_Day_Global: "select sum(value) from testdata where time > now() - 24h and sensor_id=28 or sensor_id=29 or sensor_id=30",
        waterTankLevel_Day_Max: "select max(value) from testdata where time > now() - 1h and sensor_id=7 or sensor_id=9 or sensor_id=11 group by tag_sensor_id order by time desc",
        waterTankLevel_Day_Min: "select min(value) from testdata where time > now() - 1h and sensor_id=7 or sensor_id=9 or sensor_id=11 group by tag_sensor_id order by time desc",

        timespan: {
            minute: "1m",
            hour: "1h",
            day: "24h",
            week: "7d",
            month: "30d",
            year: "365d"
        },
        GetQueryBySensor_Single = (sensor_id, timespan) => {
            if (timespan) {
                return `select mean(value) from testdata 
                where sensor_id=${sensor_id} and time > now() - ${timespan} 
                order by time desc`;
            }
            return `select value from testdata 
            where sensor_id=${sensor_id} 
            order by time desc 
            limit 1`;
        },
        GetQueryBySensor_Grouped = (timespan) => {
            //questa è da controllare
            if (timespan) {
                return `select mean(value) from testdata 
                where time > now() - ${timespan}
                group by tag_sensor_id 
                order by time desc`;                
            }
            return `select value from testdata 
            where sensor_id=${sensor_id} 
            order by time desc 
            limit 1`;
        }
    }
}

/* module.exports = function GetInfluxQueryForSensorData(sensor_id, timespan) {
    if (timespan) {
        return `select mean(value) from testdata 
        where sensor_id=${sensor_id} and time > now() - ${timespan} 
        order by time desc`;
    }
    return `select value from testdata 
    where sensor_id=${sensor_id} 
    order by time desc 
    limit 1`;
} */

