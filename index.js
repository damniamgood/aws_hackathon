// For development/testing purposes



var fs = require('fs');
var env = require('node-env-file');

env(__dirname + '/deploy.env');
console.log(process.env.BUCKET_NAME);

var BUCKET_NAME = process.env.BUCKET_NAME

var aws = require('aws-sdk');
// aws.config.loadFromPath('/tmp/AwsConfig.json');

var sleep = require('sleep');
var s3 = new aws.S3();


function noParamsGiven() {
  showUsage();
  process.exit(-1);
}



function downloadArtifacts(){
 var ghdownload = require('github-download')
  // , child_process = require('child_process')


  ghdownload({user: 'dissonanz', repo: 'undum', ref: '56c080c984b5a4c4eb2ab4e96ddf359c14f9a5b1'}, '/tmp/download')
  .on('dir', function(dir) {
    console.log(dir)
  })
  .on('file', function(file) {
    console.log(file)
  })
  .on('zip', function(zipUrl) { //only emitted if Github API limit is reached and the zip file is downloaded
    console.log(zipUrl)
  })
  .on('error', function(err) {
    console.error(err)
  })
  .on ('end', function (){
      runWithParams();
  })
  return ghdownload
}

// sleep.sleep(30);


function runWithParams() {
  console.log('S3 Deployer ... uploading to bucket [' + BUCKET_NAME + ']');
  uploadCode();
}

function uploadCode() {
  var CODE_PATH = 'download/games/';
  var fileList = getFileList('/tmp/' + CODE_PATH);

  fileList.forEach(function(entry) {
    uploadFile(CODE_PATH + entry, '/tmp/' + CODE_PATH + entry);
  });

  uploadCss();
  uploadImages();
}


function uploadCss() {
  var CODE_PATH = 'download/games/media/css/';
  var fileList = getFileList('/tmp/' + CODE_PATH);

  fileList.forEach(function(entry) {
    uploadFile(CODE_PATH + entry, '/tmp/' + CODE_PATH + entry);
  });
}


function uploadImages() {
  var CODE_PATH = 'download/games/media/img/';
  var fileList = getFileList('/tmp/' + CODE_PATH);

  fileList.forEach(function(entry) {
    uploadFile(CODE_PATH + entry, '/tmp/' + CODE_PATH + entry);
  });
}


function getFileList(path) {
  var i, fileInfo, filesFound;
  var fileList = [];

  filesFound = fs.readdirSync(path);
  for (i = 0; i < filesFound.length; i++) {
    fileInfo = fs.lstatSync(path + filesFound[i]);
    if (fileInfo.isFile()) fileList.push(filesFound[i]);
  }

  return fileList;
}


function uploadFile(remoteFilename, fileName) {
  var fileBuffer = fs.readFileSync(fileName);
  var metaData = getContentTypeByFile(fileName);

  s3.putObject({
    ACL: 'public-read',
    Bucket: BUCKET_NAME,
    Key: remoteFilename,
    Body: fileBuffer,
    ContentType: metaData
  }, function(error, response) {
    console.log('uploaded file[' + fileName + '] to [' + remoteFilename + '] as [' + metaData + ']');
    console.log(arguments);
  });
}


function getContentTypeByFile(fileName) {
  var rc = 'application/octet-stream';
  var fileNameLowerCase = fileName.toLowerCase();

  if (fileNameLowerCase.indexOf('.html') >= 0) rc = 'text/html';
  else if (fileNameLowerCase.indexOf('.css') >= 0) rc = 'text/css';
  else if (fileNameLowerCase.indexOf('.json') >= 0) rc = 'application/json';
  else if (fileNameLowerCase.indexOf('.js') >= 0) rc = 'application/x-javascript';
  else if (fileNameLowerCase.indexOf('.png') >= 0) rc = 'image/png';
  else if (fileNameLowerCase.indexOf('.jpg') >= 0) rc = 'image/jpg';

  return rc;
}


function showUsage() {
  console.log('Nothing to do.. Please pass bucket name')
}

exports.handler = function( event, context ) {
  console.log ("Downloading artifacts...")
  downloadArtifacts();
  context.done( );
}


