<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$scri = date("Y-m-d");
	$scro=date("H:i:s");
	
	$remark_detail_1=mysqli_query($con,"select * from tbl_bt_activity");
	$remark_detail=array();
	if(mysqli_num_rows($remark_detail_1)>0)
	{
		while($fetch_operator=mysqli_fetch_array($remark_detail_1))
		{	
			$remark_detail['activity_id'] = $fetch_operator['activity_id'];
			$remark_detail['release_image'] = $fetch_operator['release_image'];
			$remark_detail['activity_message'] = $fetch_operator['activity_message'];
			$remark_detail['insert_date'] = $fetch_operator['insert_date'];
			$remark_detail['insert_time'] = $fetch_operator['insert_time'];
			$remark_detail['type'] = $fetch_operator['type'];
			$response['remark_detail'][]=$remark_detail;
		}
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		$response['remark_detail']=$remark_detail;
		$response['success']='0';
		$response['details']="No Data Available";	
	}	
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>