<?php
$response = array();
include("../../connect.php");
if(isset($_POST['key_aid']) && isset($_POST['distributor_id']) && isset($_POST['total_order']))
{   	
	$toder = $_POST['total_order'];
	$p_client = $_POST['key_aid']; 
	$dis_id = $_POST['distributor_id'];
	$remark=$_POST['remark'];
	$uniqueId=uniqid();
	$uniqueId1="MT".strtoupper($uniqueId);
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
	$temp_date2=strtotime($da);
	$month_arr=array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");
	$month_arr_temp=array("J","K","L","A","B","C","D","E","F","G","H","I");
	$curre_month=date("M",$temp_date2);
	for($gh=0;$gh<count($month_arr);$gh++)
	{
		if($month_arr[$gh]==$curre_month)
		{
			$temp_string=$month_arr_temp[$gh];
		}
	}
	$temp_explode="";
	$select_order=mysqli_query($con,"select assembly_sequence from `tbl_sequence` where distributor_id='$dis_id'");
	$select_row =  mysqli_fetch_assoc($select_order);
	if(mysqli_num_rows($select_order)>0)
	{
		$temp=$select_row['assembly_sequence'];
		if($temp_string==$temp[0])
		{
			$final_invoice=(int)substr($temp,1);
			$final_invoice=$final_invoice+1;
			$final_invoice1=(string)$final_invoice;
			$string_count=5-(int)strlen($final_invoice1);
			for($vb=0;$vb<$string_count;$vb++)
			{
				$temp_explode=$temp_explode."0";
			}
			$sd=$temp_string."C".$temp_explode.$final_invoice;
		}
		else
		{
			$sd=$temp_string."C00001";
		}
		$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET assembly_sequence='$sd',last_update_datetime='$scri' where distributor_id='$dis_id'");
	}
	else
	{
		$sd=$temp_string."C00001";
		$uq_sequence =mysqli_query($con,"insert into tbl_sequence(distributor_id,assembly_sequence,last_update_datetime)values('$dis_id','$sd','$scri')");
	}	
	
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$prodid=$person_a['pid'];
		$prodname=$person_a['pname'];
		$ordquantiy=$person_a['quantity'];
		$proprice=$person_a['pro_price'];
		$probagtype = isset($person_a['bag_type']) ? $person_a['bag_type'] : '';
		$probagqty = isset($person_a['bag_qty']) ? $person_a['bag_qty'] : '';			
						
		$query2=mysqli_query($con,"INSERT INTO `tbl_distributor_material_transfer`(`distributor_id`,`transaction_date`, `transaction_time`, `product_id`, `quantity`, `product_price`, `unique_bill`, `transfer_bill_no`, `cgst_amt`, `sgst_amt`, `igst_amt`, `status`, `insert_date`,`bag_type`, `bag_qty`,remark,assembly_line_id) VALUES ('$dis_id','$da','$scro','$prodid','$ordquantiy','$proprice','$uniqueId1','$sd','0', '0', '0', 'Pending','$da','$probagtype','$probagqty','$remark','$p_client')");
						
		$query_stock="SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
		$res_stock = mysqli_query($con,$query_stock);
		$row_stock =  mysqli_fetch_assoc($res_stock);
		if(mysqli_num_rows($res_stock)>0)
		{
			$stock_quantity=$row_stock['closing_stock'];
			$temp_quantity=round($stock_quantity-$ordquantiy,2);
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
				$temp_quantity=round($stock_quantity-$ordquantiy,2);
				$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,closing_stock,opening_stock,date)values('$dis_id','$prodid','$temp_quantity','$stock_quantity','$da')");
				$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");
			}
		}

	}  
	$response['success']=1;
	$response['details']=$sd;
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 