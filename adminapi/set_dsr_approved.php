<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['total_fse']) && isset($_POST['distributor_id']))
{
	$total_fse = $_POST['total_fse'];
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:sa");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$json_a=json_decode($total_fse, true);  
	$itr_admin="No";
	$check_itr = mysqli_query($con,"select * from tbl_distributor where distributor_id='$dis_id' and dsr_requirement='Yes'");
	if(mysqli_num_rows($check_itr)>0)
		$itr_admin="Yes";
	$FIREBASE_API_KEY="AAAAZno7F7E:APA91bH7hbOcUWxp29ZfjJ4vQp-IMpuzZ3y5wNnIBRCzLOS3Fl7dD4RRzslJ4fxF5fIGoIHjcZ5kYPvVW8Obk7dI4moxP8BGbg3J47xHtEiOGZYTnOr60Rz3izk1axcCC_P0krknYmnw";
	$url = 'https://fcm.googleapis.com/fcm/send';
	$headers = array(
					'Authorization: key=' . $FIREBASE_API_KEY,
					'Content-Type: application/json'
	);
	$total_cash_amt=0;
	include("cash_bank_effect_class.php");
	$CashCollection=new Collection();
	foreach ($json_a as $person_a)
	{
		$dsr_id=$person_a['did'];
		$res = mysqli_query($con,"select user_id,cash_detail,tb_insertdate from tbl_dsr where dsr_id='$dsr_id' and dsr_status='Pending'");
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$temp_uid=$fetch_product['user_id'];
			$cash_amt=$fetch_product['cash_detail'];
			$dsrdate=$fetch_product['tb_insertdate'];
			$uq1=mysqli_query($con,"UPDATE tbl_dsr SET dsr_status='Accept',accept_reject_datetime='$scri',update_by='$dis_id' where dsr_id='$dsr_id'");
			$query = mysqli_query($con,"insert into tbl_user_message(distributor_id,title,message,create_date,create_time,user_id)values('$dis_id','DSR Approve','Your currently submitted DSR is approved.','$da','$scro','$temp_uid')");
			if($itr_admin=="Yes" && $cash_amt>0)
			{
				$collections=$CashCollection->cashcollection($dis_id,$cash_amt,$dsrdate);
			}
		}
		$sendNotify = mysqli_query($con,"SELECT device_id FROM tbl_user where user_id='$temp_uid' and status='Active'");
		$ch = curl_init ();
		while($rowNotify=mysqli_fetch_assoc($sendNotify))
		{ 
				$title="DSR status";
				$varMSG="Your currently submitted DSR has been approved!!";
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

	$response['success']='1';
	$response['details']="DSR Accept Successfully";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>