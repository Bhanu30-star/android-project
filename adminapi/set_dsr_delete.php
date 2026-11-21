<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['user_id']) && isset($_POST['distributor_id']) && isset($_POST['dsrid']))
{
	$user_id = $_POST['user_id'];
	$id1 = $_POST['dsrid'];
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
	$itr_admin="Yes";
	$cash_amt=0;
	$query = mysqli_query($con,"insert into tbl_user_message(distributor_id,title,message,create_date,create_time,user_id)values('$dis_id','DSR Delete','Your currently submitted DSR is Deleted.','$da','$scro','$user_id')"); 
	if($itr_admin=="Yes")
	{
		$update_cash_amt = mysqli_query($con,"select * from tbl_dsr where dsr_id='$id1'");
		while($fetch_cash_amt=mysqli_fetch_assoc($update_cash_amt))
		{
			$cash_amt=$fetch_cash_amt['cash_detail'];
			$dsrdate=$fetch_cash_amt['tb_insertdate'];
		}
	}
	$uq1=mysqli_query($con,"DELETE from tbl_dsr_cashDetail where dsr_id='$id1'");
	if($uq1)
	{
		$uq2=mysqli_query($con,"DELETE from tbl_dsr where dsr_id='$id1'");
		$FIREBASE_API_KEY="AAAAZno7F7E:APA91bH7hbOcUWxp29ZfjJ4vQp-IMpuzZ3y5wNnIBRCzLOS3Fl7dD4RRzslJ4fxF5fIGoIHjcZ5kYPvVW8Obk7dI4moxP8BGbg3J47xHtEiOGZYTnOr60Rz3izk1axcCC_P0krknYmnw";
		$url = 'https://fcm.googleapis.com/fcm/send';
		$headers = array(
					'Authorization: key=' . $FIREBASE_API_KEY,
					'Content-Type: application/json'
		);
		$sendNotify = mysqli_query($con,"SELECT device_id FROM tbl_user where user_id='$user_id' and status='Active'");
		$ch = curl_init ();
		while($rowNotify=mysqli_fetch_assoc($sendNotify))
		{ 
				$title="DSR status";
				$varMSG="Your currently submitted DSR has been deleted!!";
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
		if($cash_amt>0)
		{
			include("cash_bank_effect_class.php");
			$CashCollection=new Collection();
			$collections=$CashCollection->purchasecashcollection($dis_id,$cash_amt,$dsrdate);
		}
		$response['success']='1';
		$response['details']="DSR Delete Successfully";
	}
	else
	{
		$response['success']='0';
		$response['details']="DSR Not Deleted";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>