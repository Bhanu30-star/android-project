<?php
$response = array();
include("../../connect.php");
if(isset($_POST['key_aid']) && isset($_POST['distributor_id']) && isset($_POST['total_order']))
{   	
	$toder = $_POST['total_order'];
	$pp_id1 = $_POST['key_aid']; 
	$dis_id = $_POST['distributor_id'];
	$remark=$_POST['remark'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$uniqueId=uniqid();
	$uniqueId1="RT".strtoupper($uniqueId);
	$txn_billno_val=$_POST['txn_billno'];
	$txn_uniquebill_val=$_POST['txn_uniquebill'];
	$bill_no_val=$_POST['bill_no'];
	$assembly_amt=$_POST['assembly_amt'];
	$res_check_val = mysqli_query($con,"select * from tbl_distributor_material_transfer where distributor_id='$dis_id' and status='Pending' and transfer_bill_no='$txn_billno_val' and unique_bill='$txn_uniquebill_val'");
	if(mysqli_num_rows($res_check_val)>0)
	{
		$json_a=json_decode($toder, true);     
		foreach ($json_a as $person_a)
		{
			$prodid=$person_a['pid'];
			$prodname=$person_a['pname'];
			$ordquantiy=$person_a['quantity'];
			$proprice=$person_a['pro_price'];
			$probagtype = isset($person_a['bag_type']) ? $person_a['bag_type'] : '';
			$probagqty = isset($person_a['bag_qty']) ? $person_a['bag_qty'] : '';	
			$query2=mysqli_query($con,"INSERT INTO `tbl_distributor_material_received`(`distributor_id`, `assembly_line_id`, `transaction_date`, `transaction_time`, `product_id`, `quantity`, `bag_type`, `bag_qty`, `product_price`, `unique_bill`, `transfer_bill_no`, `receive_bill_no`, `cgst_amt`, `sgst_amt`, `igst_amt`, `status`, `remark`, `insert_date`,`assembly_charges`) VALUES ('$dis_id','$pp_id1','$da','$scro','$prodid','$ordquantiy','$probagtype','$probagqty','$proprice','$uniqueId1','$txn_billno_val','$bill_no_val', '0', '0','0', 'Complete','$remark','$scri','$assembly_amt')");
						
			$query_stock="SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
			$res_stock = mysqli_query($con,$query_stock);
			$row_stock =  mysqli_fetch_assoc($res_stock);
			if(mysqli_num_rows($res_stock)>0)
			{
				$stock_quantity=$row_stock['closing_stock'];
				$temp_quantity=round($stock_quantity+$ordquantiy,2);
				$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity' where date ='$da' and distributor_id='$dis_id' and product_id='$prodid'");	
				$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");	
			}
			else
			{
				$query_stock1="SELECT closing_stock FROM tbl_distributor_stock where date <='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
				$res_stock1 = mysqli_query($con,$query_stock1);
				$row_stock1 =  mysqli_fetch_assoc($res_stock1);
				if(mysqli_num_rows($res_stock1)>0)
				{
					$stock_quantity=$row_stock1['closing_stock'];
					$temp_quantity=round($stock_quantity+$ordquantiy,2);
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,closing_stock,opening_stock,date)values('$dis_id','$prodid','$temp_quantity','$stock_quantity','$da')");
					$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");
				}
			}
		}  
		$res_check_val = mysqli_query($con,"update tbl_distributor_material_transfer set status='Complete' where distributor_id='$dis_id' and status='Pending' and transfer_bill_no='$txn_billno_val' and unique_bill='$txn_uniquebill_val'");
		$response['success']=1;
		$response['details']="Material Successfully Received";
	}
	else
	{
		$response['success']=0;
		$response['details']="Bill Not Matched";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 