const fs = require('fs')
const util = require('util');
const paths = [
    { title: "students", path: "./data/students.csv" },
    { title: "marks", path: "./data/marks.csv" },
    { title: "courses", path: "./data/courses.csv" },
    { title: "tests", path: "./data/tests.csv" },
]

/**
 * Function takes string as parameter to parse csv to js object
 * @param {String} path 
 * @return {Object}
 */

var parseCSV = function(path) {
    var fileContent = fs.readFileSync(path, { encoding: "utf8" });
    var body = fileContent.split(/\n/);
    var header = body.shift().split(',');
    var arrayObject = [];
    for (var i = 0; i < body.length; i++) {
        var row = body[i].split(',');
        var newObject = {};
        if (row.length > 1){
            for (var j = 0; j < row.length; j++) {
                newObject[header[j]] = row[j]
            }
            arrayObject.push(newObject);
        }
    }
    return arrayObject;
}

const mainStudents = parseCSV("./data/students.csv")
const mainMarks = parseCSV("./data/marks.csv")
const mainCourses = parseCSV("./data/courses.csv")
const mainTests = parseCSV("./data/tests.csv")

/**
 * Function takes in Student array then traversal through each student to populate data.
 * Then create readable text file 
 * @param {Array} students 
 * @param {Array} marks 
 * @param {Array} tests 
 * @param {Array} courses 
 */
var parseStudent = function(students, marks, tests, courses) {
    var emptyArr = [];
    for (var i = 0 ; i < students.length; i++) {
        var newObject = students[i];
        const { id, name } = students[i];

        const mark = findMarks(marks, tests, courses, id);
        newObject.marks = mark;
        emptyArr.push(newObject);
    }
    const data = summarize(emptyArr);
    createTextFile(data);
}


/**
 * Function takes new coverted csv file and traversal through each student => marks => test => course
 * and populate each corresponding field
 * @param {Array} marks 
 * @param {Array} tests 
 * @param {Array} courses 
 * @param {Int} id 
 * @return {Object}
 */
var findMarks = function(marks, tests, courses, id) {
    return marks.filter((mark, index) => (
        mark.student_id === id
    )).map((mark, index) => {
        var temp = mark
        temp.test = tests.find((test) => (
            test.id === mark.test_id
        ))
        const temp2 = temp.test
        temp.course = courses.find((course) => (
            temp2.course_id === course.id
        ))
        temp["percentage"] = parseInt(temp.mark) * (parseInt(temp.test.weight) / 100);
        delete temp.student_id;
        delete temp.test_id;
        delete temp.course_id;
        return temp;
    })
}

/**
 * Function takes all parsed pervious data then parse it further to narrow down to more sophisticated information
 * @param {Array} data 
 * @return {Array}
 */
var summarize = function(data) {
    var parent = [];
    for (var i = 0; i < data.length; i++) {
        var newObject = {};
        newObject["id"] = data[i].id;
        newObject["name"] = data[i].name;
        newObject["marks"] = [];
        
        var sum = 0;
        var current = data[i].marks[0].course;
        const marks = [];
        const avg = [];

        for (var j = 0; j < data[i].marks.length; j++) {
            const { mark, test, course, percentage } = data[i].marks[j]
            if (course.name === current.name) {
                sum += percentage;
            } else {
                avg.push(sum);
                marks.push({ ...current, mark:sum});
                sum = percentage;
                current = course;
            }
        }
        avg.push(sum);
        marks.push({ ...current, mark:sum})
        newObject["marks"] = marks;
        newObject["total_average"] = getAvg(avg);
        parent.push(newObject);
    }
    return parent;
}

/**
 * Function takes data then convert it to specific styled text file (./report_card.txt)s
 * @param {Array} data 
 */
var createTextFile = function(data) {
    var file = fs.createWriteStream('report_card.txt')
    file.once('open', function() {
        for (var i = 0; i < data.length; i++) {
            const { id, name, marks, total_average } = data[i];
            file.write(`Student Id: ${id}, name: ${name}\n`);
            file.write(`Total Average:    ${total_average.toFixed(2)}%\n`);
            file.write('\n')
            for (var j = 0; j < marks.length; j++) {
                const { id, name, teacher, mark} = marks[j]
                file.write(`        Course: ${name}, Teacher: ${teacher}\n`);
                file.write(`        Final Grade:    ${mark.toFixed(2)}%\n`)
                file.write('\n')
            }
        }
        file.end();
    })
}

/**
 * Function takes array then calculate average;
 * @param {Array} arr 
 * @return {Number}
 */
function getAvg(arr) {
    var sum = 0;
    arr.forEach((num) => {
        sum += num
    })
    return sum / arr.length;
}



console.log(parseStudent(mainStudents, mainMarks, mainTests, mainCourses));