<?php
$response = array();
include("../../connect.php");
if(isset($_POST['party_id']) && isset($_POST['status']) && isset($_POST['user_id']))
{  
	$party_id = $_POST['party_id'];
	$status = $_POST['status'];  
	$user_id = $_POST['user_id'];  
	date_default_timezone_set('Asia/Calcutta');
	$clientIP = $_SERVER['REMOTE_ADDR'];
	$apiUrl = "http://ipinfo.io/{$clientIP}/json";
	$response1 = file_get_contents($apiUrl);
	$details = json_decode($response1, true);
	if($details['country']=='AE')
	{
		date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	
	if($status=="Approve")
	{
		$res_product_stock = mysqli_query($con,"SELECT tbl_party_user.user_id FROM tbl_party,tbl_party_user where tbl_party_user.party_id=tbl_party.party_id and tbl_party.party_id='$party_id'");
		if(mysqli_num_rows($res_product_stock)>0)
		{
			while($party_fos_detail=mysqli_fetch_assoc($res_product_stock))
			{ 
				$user_temp_id=$party_fos_detail['user_id'];
				$uq2=mysqli_query($con,"UPDATE tbl_party SET status='Active'  where party_id='$party_id'");
				$FIREBASE_API_KEY="AAAAVyfiVyU:APA91bEuFtlx9YCYgOHSp4WqrCt_r1OjxWDE2lPdGhjwlVkH-kKhJTilGnqNavxwcQq1-6H490yAKw0KytmC3qUmzTAQVpDvNMJWeh6gNx1-j8iksbdoOh8mcGG5xubWH3Cz2N3NnYlY";
				$url = 'https://fcm.googleapis.com/fcm/send';
				$headers = array(
								'Authorization: key=' . $FIREBASE_API_KEY,
								'Content-Type: application/json'
				);
				$sendNotify = mysqli_query($con,"SELECT device_id FROM tbl_user where user_id='$user_temp_id' and status='Active'");
				$ch = curl_init ();
				while($rowNotify=mysqli_fetch_assoc($sendNotify))
				{ 
						$title="New Retailer Creation Status";
						$varMSG="Your currently inserted retailer has been Approved!!";
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
			}
			$response['success']=1;
			$response['details']="Party successfully approved!";
		}
		else
		{
			$response['success']=0;
			$response['details']="Your approved Party not exists. Please check and try again later..!!";
		}
	} else if($status=="Reject") {
		$res_detail = mysqli_query($con,"SELECT * FROM tbl_party,tbl_party_user where tbl_party_user.party_id=tbl_party.party_id and tbl_party.party_id='$party_id'");
		while($fetch_proDetail=mysqli_fetch_assoc($res_detail))
		{
			$user_temp_id=$fetch_proDetail['user_id'];
			$session_dist_ver=$fetch_proDetail['distributor_id'];
			$st_query2 = mysqli_query($con,"INSERT IGNORE INTO `tbl_party_history` (`party_id`, `party_name`, `party_phone`, `party_email`, `distributor_id`, `group_name`, `gstin_no`, `party_address`, `count`, `tb_insertdatetime`, `status`, `party_code`, `pan_it_no`, `state_name`, `place_of_supply`) VALUES('".$fetch_proDetail['party_id']."','".$fetch_proDetail['party_name']."','".$fetch_proDetail['party_phone']."','".$fetch_proDetail['party_email']."','".$fetch_proDetail['distributor_id']."','".$fetch_proDetail['group_name']."','".$fetch_proDetail['gstin_no']."','".$fetch_proDetail['party_address']."','".$fetch_proDetail['count']."','".$fetch_proDetail['tb_insertdatetime']."','".$fetch_proDetail['status']."','".$fetch_proDetail['party_code']."','".$fetch_proDetail['pan_it_no']."','".$fetch_proDetail['state_name']."','".$fetch_proDetail['place_of_supply']."')");
		}
		$resd2 = mysqli_query($con,"DELETE FROM tbl_party where party_id='$party_id'");
		$resd21 = mysqli_query($con,"DELETE FROM tbl_party_user where party_id='$party_id'");
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver','INSERT+DELETE OPERATION,FOS party approve reject#Admin(INSERT)tbl_party_history#(DELETE)tbl_party,tbl_party_user', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");

		$FIREBASE_API_KEY="AAAAVyfiVyU:APA91bEuFtlx9YCYgOHSp4WqrCt_r1OjxWDE2lPdGhjwlVkH-kKhJTilGnqNavxwcQq1-6H490yAKw0KytmC3qUmzTAQVpDvNMJWeh6gNx1-j8iksbdoOh8mcGG5xubWH3Cz2N3NnYlY";
		$url = 'https://fcm.googleapis.com/fcm/send';
		$headers = array(
					'Authorization: key=' . $FIREBASE_API_KEY,
					'Content-Type: application/json'
		);
		$sendNotify = mysqli_query($con,"SELECT device_id FROM tbl_user where user_id='$user_temp_id' and status='Active'");
		$ch = curl_init ();
		while($rowNotify=mysqli_fetch_assoc($sendNotify))
		{ 
				$title="New Retailer Creation Status";
				$varMSG="Your currently inserted retailer has been rejected!!";
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
		$response['success']=1;
		$response['details']="Party successfully rejected!";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 