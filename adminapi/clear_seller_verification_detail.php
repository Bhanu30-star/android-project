<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['party_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
    $party_id = $_POST['party_id'];
	$updateParty = mysqli_query($con, "UPDATE `tbl_party` SET verified = 'No' WHERE distributor_id = '$session_dist_ver' and party_id = '$party_id'");
	if ($updatePurchaseParty) 
	{
		$response['success']='1';
		$response['message']="Your Party Verification Successfully Cleared!!";
	}
	else
	{
		$response['success']='0';
		$response['message']="Verification Not Cleared!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>