////////////////////////////
////////////////////////////
////////////////////////////

function eraseRoland(){

	var firstCommand = 'net stop spooler';

	fireCommand(firstCommand,function(){

		var secondCommand = 'del C:\\windows\\System32\\spool\\PRINTERS\\*.SPL';

		fireCommand(secondCommand,function(){

			var thirdCommand = 'del C:\\windows\\System32\\spool\\PRINTERS\\*.SHD';

			fireCommand(thirdCommand,function(){

				var finalCommand = 'net start spooler';

				fireCommand(finalCommand,function(){

					console.log('yaaaa');

				});
			});
		});
	});

	////////////////////////////
	////////////////////////////
	////////////////////////////

	function fireCommand(cmd,onSuccess,onError){

		var exec = require('child_process').exec;

		exec(cmd,function(error,stdin,stdout){
			if(error){
				if(onError){
					onError(error);
				}
				else{
					console.log('Error running command: '+cmd);
					console.log(error);
				}
			}
			else{
				if(onSuccess) onSuccess(stdin,stdout);
			}
		});
	}

}

////////////////////////////
////////////////////////////
////////////////////////////