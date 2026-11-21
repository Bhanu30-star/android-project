<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{	
		$response['user_status']='0'; 
		$response['session_id']='';
		$response['user_imei']='';
	}
	$select_party=mysqli_query($con,"select * from tbl_distributor_beat where distributor_id='$ver' and status in ('Active','Deactive') ");
	if(mysqli_num_rows($select_party)>0)
	{     
		$beat_detail=array();
		while($fetch_user=mysqli_fetch_array($select_party))
		{
			$beat_detail['beat_id']=$fetch_user['beat_id'];
			$beat_detail['beat_name']=$fetch_user['beat_name'];
			$beat_detail['status']=$fetch_user['status'];
			$response['beat_detail'][]=$beat_detail;
		}
		$response['success']='1';
	    $response['details']="Fetch Detail Successful";
	}
	else
	{
	  $response['success']='0';
	  $response['details']="Beat Doesn't Exist!";	
	}
}
else 
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>