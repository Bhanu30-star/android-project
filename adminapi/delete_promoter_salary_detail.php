<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['txn_id']))
{
	$ver = $_POST['distributor_id'];
	$head_id = $_POST['txn_id'];
	$cdate11  = date("Y-m-d")." ".date("H:i:s");
	$query = "UPDATE `tbl_promoter_salary_detail` SET `status`='Deleted' WHERE id='$head_id'";
    $result = mysqli_query($con, $query);
	$response['success']='1';
	$response['details']="Record deleted successfully.";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>