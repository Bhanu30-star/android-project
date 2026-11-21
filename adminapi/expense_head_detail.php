<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_user_id']) && isset($_POST['distributor_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$dis_id = $_POST['distributor_id'];
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
	$res_head = mysqli_query($con,"SELECT * FROM `tbl_expense_head` WHERE distributor_id='$dis_id' AND status in ('Active','Deactive')");
	$head_detail=array();
	if(mysqli_num_rows($res_head)>0)
	{     
		while($fetch_product=mysqli_fetch_array($res_head))
		{
			$head_detail['head_id']=$fetch_product['head_id'];
			$head_detail['expense_head_name']=$fetch_product['expense_head_name'];
			$head_detail['expenses_category']=$fetch_product['expenses_category'];
			$head_detail['status']=$fetch_product['status'];
			$response['head_detail'][]=$head_detail;
		}
	}
	else
	{
		$response['head_detail']=$head_detail;
	}
	
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['message']="Required Field Missing";
}	
echo json_encode($response);
?>