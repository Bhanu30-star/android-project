<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['head_name']) && isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$bname=$_POST['head_name'];
	$id1=$_POST['head_id'];
	$ecategory = isset($_POST['head_category']) ? $_POST['head_category'] : '';
	
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11=date("Y-m-d");
	$rs1=mysqli_query($con,"select * from tbl_expense_head where distributor_id='$session_dist_ver' and head_id!='$id1' and expense_head_name='$bname'");
	if(mysqli_num_rows($rs1)<=0)
	{
		$rs11=mysqli_query($con,"select * from tbl_expense_head where distributor_id='$session_dist_ver' and head_id='$id1' and expense_head_name='$bname'");
		$fetch_product=mysqli_fetch_assoc($rs11);
		$query = mysqli_query($con,"INSERT INTO `tbl_expense_head_history`(`head_id`, `distributor_id`, `expense_head_name`, `status`, `insert_date`,`expenses_category`) VALUES ('$id1','$session_dist_ver','".$fetch_product['expense_head_name']."','Active','$cdate11','$ecategory')");
		$query_update = mysqli_query($con,"UPDATE `tbl_expense_head` SET expense_head_name='$bname',expenses_category='$ecategory' where distributor_id='$session_dist_ver' and head_id='$id1'");
		$response['success']='1';
		$response['message']="Expense Head Successfully Updated";
	}
	else
	{
		$response['success']='0';
		$response['message']="Head already exists";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>