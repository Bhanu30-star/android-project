<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$res = mysqli_query($con,"select * from tbl_distributor_bag_detail where distributor_id='$session_dist_ver' and status in ('Active','Deactive') order by bag_qty asc");
	if(mysqli_num_rows($res)>0)
	{     
		$pkt_bag_detail=array();
		while($fetch_user=mysqli_fetch_array($res))
		{
			$pkt_bag_detail['bag_id']=$fetch_user['bag_id'];
			$pkt_bag_detail['bag_qty']=$fetch_user['bag_qty'];
			$pkt_bag_detail['status']=$fetch_user['status'];
			$response['pkt_bag_detail'][]=$pkt_bag_detail;

		}
		$response['success']='1';
	    $response['message']="Fetch Detail Successful";
	}
	else
	{
	  $response['success']='0';
	  $response['message']="Bag Detail Doesn't Exists!";	
	}
}
else 
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>