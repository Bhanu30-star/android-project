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
	$select_party=mysqli_query($con,"select * from tbl_assembly_line where distributor_id='$ver' and status in ('Active','Deactive') ");
	if(mysqli_num_rows($select_party)>0)
	{     
		$assemblyline_detail=array();
		while($fetch_user=mysqli_fetch_array($select_party))
		{
			$assemblyline_detail['detail_id']=$fetch_user['detail_id'];
			$assemblyline_detail['assembly_name']=$fetch_user['assembly_name'];
			$assemblyline_detail['phone_no']=$fetch_user['phone_no'];
			$assemblyline_detail['gstin_no']=$fetch_user['gstin_no'];
			$assemblyline_detail['address']=$fetch_user['address'];
			$assemblyline_detail['place_of_supply']=$fetch_user['place_of_supply'];
			$assemblyline_detail['status']=$fetch_user['status'];
			$response['assemblyline_detail'][]=$assemblyline_detail;
		}
		$response['success']='1';
	    $response['details']="Fetch Detail Successful";
	}
	else
	{
	  $response['success']='0';
	  $response['details']="Assembly Name/Phone Doesn't Exist!";	
	}
}
else 
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>