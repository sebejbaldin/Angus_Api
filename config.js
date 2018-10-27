// 10.10.10.1:3306 - piedpiper:PiedPiper2018
module.exports = {
  jwt_secret: 'A7BB5A1CEB2D9D5174C3D0DF08E70CD7320CA86F2AFB6CF05A287BD4E9DD27E0',
  mysql_config: {
    hostname: '10.10.10.1',
    port: 3306,
    username: 'root',
    password: 'Passw0rd!',
    database: 'db_piedpiper'
  },
  influx_config: {
    hostname: '10.10.10.6',
    port: 8086,
    database: 'Angus_v1'
  }
};
