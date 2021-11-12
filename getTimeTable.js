db.getConnection(async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "SELECT * FROM userdb.timetable"
    //const search_query = mysql.format(sqlSearch, [username])
    await connection.query(sqlSearch, async (err, result) => {
        connection.release()
        console.log(result)
    })})
