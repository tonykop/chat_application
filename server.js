var http=require('http');
var fs=require('fs');
var path=require('path');
var mime=require('mime');
var ipEm=require('events').EventEmitter;
var ipEmObject=new ipEm();

var cache={};
var ip;
/* 请求文件不存在时发送404错误*/
function send404(response){
  response.writeHead(404,{'Content-Type':'text/plain'});
  response.write('Error 404:resource not found');
  response.end();
}
/*提供文件数据服务*/
function sendFile(response,filePath,fileContents){
  response.writeHead(
    200,{
      "Content-Type":mime.lookup(path.basename(filePath))
    }
  );
  response.end(fileContents);
}
/*第一次访问的时候才会从文件系统中读取，函数会确定文件是否缓存了，如果是，就返回他，如果文件还没有
*被缓存，它会从硬盘中读取并返回，如果文件不存在，返回一个http 404错误作为响应
*/
function serveStatic(response,cache,absPath){
  if(cache[absPath]){
    sendFile(response,absPath,cache[absPath]);
  }else{
    fs.exists(absPath,function(exists){
      if(exists){
        fs.readFile(absPath,function(err,data){
          if(err){
            console.log("读取数据出错");
            send404(response);
          }else{
            cache[absPath]=data;
            sendFile(response,absPath,data);
          }
        });
      }else{
        console.log("路径不对");
        send404(response);
      }
    });
  }
}

var server=http.createServer(function(request,response){
  var filePath=false;
  // var ip = request.headers['x-forwarded-for'] ||
  //    request.connection.remoteAddress ||
  //    request.socket.remoteAddress ||
  //    request.connection.socket.remoteAddress;
  ip=request.connection.remoteAddress.substring(5,30);//获取客户端ip
  
     ipEmObject.emit('gip',ip);//发送事件，让客户端用自己的ip作为聊天名称

  if(request.url == '/'){
    filePath='public/index.html';
    console.log("路径/public/index.html");
      console.log(filePath);
  }else{
    console.log("路径public");
    filePath='public'+request.url;
  }
  var absPath='./'+filePath;
  serveStatic(response,cache,absPath);
});

server.listen(3000,function(){
  console.log("server listening on port 3000.");
});


var chatServer=require('./lib/chat_server');

chatServer.listen(server,ipEmObject);
