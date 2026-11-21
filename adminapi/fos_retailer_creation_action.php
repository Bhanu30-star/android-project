<?php
$response = array();
include("../../connect.php");
if(isset($_POST['pcid']) && isset($_POST['pstatus']) && isset($_POST['user_id']))
{  
	$user_id = $_POST['user_id']; 
	$pstatus=$_POST['pstatus'];
	$followupdate=$_POST['followupdate'];
	$pcid=$_POST['pcid'];
	$remark=$_POST['remark'];
	$ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	if($pstatus=="Approve")
	{
		$res_product_stock = mysqli_query($con,"SELECT * FROM  tbl_party_creation where party_creation_id='$pcid' and distributor_id='$ver'");
		if(mysqli_num_rows($res_product_stock)>0)
		{
			while($fetch_product=mysqli_fetch_assoc($res_product_stock))
			{
				extract($fetch_product);
				$query = mysqli_query($con,"INSERT IGNORE INTO tbl_party(party_name,	party_phone,gstin_no,party_address,tb_insertdatetime,tb_inserttime,group_name,state_name,pan_it_no,place_of_supply,party_code,status,distributor_id)values('$party_name','$party_phone','$gstin_no','$address','$da','$scro','Sundry Debtors','$state_name','$panit_no','$place_of_supply','$party_code','Active','$ver')");
				$res_party = mysqli_query($con,"SELECT party_id FROM tbl_party where party_phone='$party_phone' and distributor_id='$ver'");
				if(mysqli_num_rows($res_party)>0)
				{
					$fetch_party=mysqli_fetch_assoc($res_party);
					$party_id=$fetch_party['party_id'];
					$query11 = mysqli_query($con,"INSERT IGNORE INTO tbl_party_user(party_id,user_id,insert_date)values('$party_id','$user_id','$da')");
				}
			}
			$uq_sequence=mysqli_query($con,"UPDATE tbl_party_creation SET status='Approve',tb_updatedatetime='$scri' where distributor_id='$ver' and party_creation_id='$pcid'");
			$action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$ver','INSERT+UPDATE OPERATION,FOS retailer creation action#Admin(INSERT)tbl_party_user,tbl_party,(UPDATE)tbl_party_creation', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
		}
		$FIREBASE_API_KEY="AAAAVyfiVyU:APA91bEuFtlx9YCYgOHSp4WqrCt_r1OjxWDE2lPdGhjwlVkH-kKhJTilGnqNavxwcQq1-6H490yAKw0KytmC3qUmzTAQVpDvNMJWeh6gNx1-j8iksbdoOh8mcGG5xubWH3Cz2N3NnYlY";
		$url = 'https://fcm.googleapis.com/fcm/send';
		$headers = array(
								'Authorization: key=' . $FIREBASE_API_KEY,
								'Content-Type: application/json'
		);
		$sendNotify = mysqli_query($con,"SELECT device_id FROM tbl_user where user_id='$user_id' and status='Active'");
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
	else if($pstatus=="Reject")
	{
			$uq_sequence=mysqli_query($con,"UPDATE tbl_party_creation SET status='Reject',tb_updatedatetime='$scri',remark='$remark' where distributor_id='$ver' and party_creation_id='$pcid'");
			$FIREBASE_API_KEY="AAAAVyfiVyU:APA91bEuFtlx9YCYgOHSp4WqrCt_r1OjxWDE2lPdGhjwlVkH-kKhJTilGnqNavxwcQq1-6H490yAKw0KytmC3qUmzTAQVpDvNMJWeh6gNx1-j8iksbdoOh8mcGG5xubWH3Cz2N3NnYlY";
				$url = 'https://fcm.googleapis.com/fcm/send';
				$headers = array(
								'Authorization: key=' . $FIREBASE_API_KEY,
								'Content-Type: application/json'
				);
				$sendNotify = mysqli_query($con,"SELECT device_id FROM tbl_user where user_id='$user_id' and status='Active'");
				$ch = curl_init ();
				while($rowNotify=mysqli_fetch_assoc($sendNotify))
				{ 
						$title="New Retailer Creation Status";
						$varMSG="Your currently inserted retailer has been Rejected!!";
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
	else
	{
		$uq_sequence=mysqli_query($con,"UPDATE tbl_party_creation SET tb_updatedatetime='$scri',next_followup_date='$followupdate',remark='$remark' where distributor_id='$ver' and party_creation_id='$pcid'");
	}		
	$response['success']=1;
	$response['details']="Action successfully Taken";	
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 