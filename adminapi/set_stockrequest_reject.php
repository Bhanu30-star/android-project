<?php
include("../../connect.php"); 
$response = array();
include("create_log.php");
$file = '../log/fse_request.log';
if(isset($_POST['transaction_id']) && isset($_POST['distributor_id']))
{
	$id1 = $_POST['transaction_id'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$user_request_check = mysqli_query($con,"SELECT * FROM tbl_user_request where transaction_id ='$id1' and status='Pending'");
	if(mysqli_num_rows($user_request_check)>0)
	{
	
		$txn_u_id="";
		$uq1=mysqli_query($con,"UPDATE tbl_user_request SET status='Cancelled',cancel_datetime='$scri',action_source='APP'  where transaction_id='$id1'");
		
		$user_request_query = mysqli_query($con,"SELECT * FROM tbl_user_request where transaction_id ='$id1'");
		while($row_request_query=mysqli_fetch_assoc($user_request_query))
		{
			$txn_date=$row_request_query['transaction_date'];
			$txn_time=$row_request_query['transaction_time'];
			$txn_utxn_id=$row_request_query['user_transaction_id'];
			$txn_amount=$row_request_query['total_amount'];
			$txn_u_id=$row_request_query['user_id'];
			$txn_status=$row_request_query['status'];
			$txn_partyid=$row_request_query['party_id'];
			$st_query1 = mysqli_query($con,"INSERT IGNORE INTO tbl_user_request_txn(transaction_date,transaction_time,user_transaction_id,total_amount,user_id,status,txn_datetime,action_by,party_id)values('$txn_date','$txn_time','$txn_utxn_id','$txn_amount','$txn_u_id','$txn_status','$scri','$ver','$txn_partyid')");
		}
		$query = mysqli_query($con,"INSERT IGNORE INTO tbl_user_message(distributor_id,title,message,create_date,create_time,user_id)values('$ver','Stock Request Reject','Your currently submitted Stock Request is rejected.','$da','$scro','$txn_u_id')");
		$query11="SELECT * FROM  tbl_user_request_txn where user_id ='$txn_u_id' ORDER BY `transaction_id` DESC LIMIT 1";
		$res11 = mysqli_query($con,$query11);
		$row11 =  mysqli_fetch_assoc($res11);
		if(mysqli_num_rows($res11)>0)
		{		
				$re11= $row11['transaction_id'];
		}
		$user_request_detail_query = mysqli_query($con,"SELECT product_id,product_name,quantity FROM tbl_user_request_detail where transaction_id ='$id1'");
		while($detail_request_query=mysqli_fetch_assoc($user_request_detail_query))
		{
			$prodid=$detail_request_query['product_id'];
			$prodname=$detail_request_query['product_name'];
			$ordquantiy=$detail_request_query['quantity'];
			$query21=mysqli_query($con,"INSERT IGNORE INTO tbl_user_request_detail_txn(transaction_id,product_id,product_name,quantity)values('$re11','$prodid','$prodname','$ordquantiy')");
		}
		
		
		$FIREBASE_API_KEY="AAAAZno7F7E:APA91bH7hbOcUWxp29ZfjJ4vQp-IMpuzZ3y5wNnIBRCzLOS3Fl7dD4RRzslJ4fxF5fIGoIHjcZ5kYPvVW8Obk7dI4moxP8BGbg3J47xHtEiOGZYTnOr60Rz3izk1axcCC_P0krknYmnw";
			$url = 'https://fcm.googleapis.com/fcm/send';
			$headers = array(
						'Authorization: key=' . $FIREBASE_API_KEY,
						'Content-Type: application/json'
			);
			$sendNotify = mysqli_query($con,"SELECT device_id FROM tbl_user where user_id='$txn_u_id' and status='Active'");
			$ch = curl_init ();
			while($rowNotify=mysqli_fetch_assoc($sendNotify))
			{ 
					$title="Stock request status";
					$varMSG="Your Stock request ".$txn_utxn_id." has been rejected. Please check and resubmit!!";
					$key=$rowNotify['device_id'];
					$fields = array('to' => $key, 'notification' =>array('title'=>$title,'body'=>$varMSG));
					$payload = json_encode ( $fields );
					curl_setopt ( $ch, CURLOPT_URL, $url );
					curl_setopt ( $ch, CURLOPT_POST, true );
					curl_setopt ( $ch, CURLOPT_HTTPHEADER, $headers );
					curl_setopt ( $ch, CURLOPT_RETURNTRANSFER, true );
					curl_setopt($ch, CURLOPT_SSL_VERIFYPEER,FALSE);
					//curl_setopt($ch,CURLOPT_SSL_VERIFYHOST,0);
					curl_setopt($ch,CURLOPT_IPRESOLVE,CURL_IPRESOLVE_V4);
					curl_setopt ( $ch, CURLOPT_POSTFIELDS, $payload);
					$result = curl_exec ( $ch );
			}
			curl_close ( $ch );
			$response['success']='1';
			$response['details']="Request Reject Successfully";
	}
	else
	{
		$response['success']='1';
		$response['details']="Already Request Complete";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>