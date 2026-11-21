<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$query1 = mysqli_query($con,"select * from tbl_party where distributor_id='$session_dist_ver' and verified='Yes'");
	if(mysqli_num_rows($query1)>0)
	{     
		$buyer_detail=array();
		while($fetch_product2=mysqli_fetch_assoc($query1))
		{
			$buyer_detail['party_id']=$fetch_product2['party_id'];
			$buyer_detail['party_name']=$fetch_product2['party_name'];
			$buyer_detail['gstin_no']=$fetch_product2['gstin_no'];
			$buyer_detail['legal_name']=$fetch_product2['legal_name'];
			$buyer_detail['trade_name']=$fetch_product2['trade_name'];
			$buyer_detail['location']=$fetch_product2['location'];
			$buyer_detail['party_pincode']=$fetch_product2['party_pincode'];
			$buyer_detail['state_name']=$fetch_product2['state_name'];
			$buyer_detail['party_code']=$fetch_product2['party_code'];
			$buyer_detail['party_address']=$fetch_product2['party_address'];
			$response['buyer_detail'][]=$buyer_detail;
		}
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>