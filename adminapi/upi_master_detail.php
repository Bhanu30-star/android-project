<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_upi_master WHERE Distributor_id='$dis_id'");
	$upi_detail=array();
	if(mysqli_num_rows($bank_matser_detail)>0)
	{     
		while($fetch_product=mysqli_fetch_array($bank_matser_detail))
		{
			$upi_detail['upi_id']=$fetch_product['upi_id'];
			$upi_detail['upi_detail']=$fetch_product['upi_detail'];
			$upi_detail['type']=$fetch_product['type'];
			$response['upi_detail'][]=$upi_detail;
		}
	}
	else
	{
		$response['upi_detail']=$upi_detail;
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